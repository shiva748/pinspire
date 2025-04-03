import React from "react";

const Profile = () => {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
      <div className="card w-full max-w-2xl bg-white shadow-xl p-6 rounded-lg">
        <div className="flex flex-col items-center">
          <div className="avatar">
            <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src="https://placekitten.com/200/200" alt="Profile" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mt-4">John Doe</h2>
          <p className="text-gray-500">UI/UX Designer | Developer</p>
          <p className="mt-2 text-center text-gray-600">
            Passionate about crafting beautiful and functional user experiences.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          <div className="p-4 bg-primary text-white rounded-lg">
            <h3 className="text-xl font-bold">120</h3>
            <p>Posts</p>
          </div>
          <div className="p-4 bg-primary text-white rounded-lg">
            <h3 className="text-xl font-bold">8.5K</h3>
            <p>Followers</p>
          </div>
          <div className="p-4 bg-primary text-white rounded-lg">
            <h3 className="text-xl font-bold">530</h3>
            <p>Following</p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button className="btn btn-primary btn-wide">Edit Profile</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;